#!/bin/bash
set -e

# Configuration
RG="rg-vitalparse-dev-centralindia"
OLD_RG="rg-vitalparse-dev-eastus"
OLD_KV="kv-vitalparse-dev"
LOC="centralindia"
KV="kv-vitalparse-dev-cin"
SA="stvitalparsedevcin"
PSQL="psql-vitalparse-dev-cin"
LAW="law-vitalparse-dev-cin"
APPI="appi-vitalparse-dev-cin"
PLAN_WEB="plan-web-vitalparse-dev-cin"
APP_WEB="app-web-vitalparse-dev-cin"
PLAN_FUNC="plan-func-vitalparse-dev-cin"
APP_FUNC="func-vitalparse-dev-cin"
ID_GITHUB="id-vitalparse-github-cin"
SUB_ID=$(az account show --query id -o tsv)

echo "🚀 Starting Azure Provisioning in $LOC..."

# 1. Create Resource Group
echo "Creating Resource Group..."
az group create --name $RG --location $LOC -o none

# 2. Key Vault & Secrets
echo "Creating Key Vault and migrating secrets..."
az keyvault create --name $KV --resource-group $RG --location $LOC --enable-rbac-authorization false -o none
GEMINI_KEY=$(az keyvault secret show --vault-name $OLD_KV --name "gemini-api-key" --query value -o tsv || echo "")
GEMINI_KEY_2=$(az keyvault secret show --vault-name $OLD_KV --name "GeminiApiKey" --query value -o tsv || echo "")

if [ -n "$GEMINI_KEY" ]; then
    az keyvault secret set --vault-name $KV --name "gemini-api-key" --value "$GEMINI_KEY" -o none
fi
if [ -n "$GEMINI_KEY_2" ]; then
    az keyvault secret set --vault-name $KV --name "GeminiApiKey" --value "$GEMINI_KEY_2" -o none
fi

# 3. PostgreSQL
echo "Creating PostgreSQL Server (This takes ~5-10 minutes)..."
DB_PASS=$(openssl rand -base64 15)
az postgres flexible-server create \
  --resource-group $RG \
  --name $PSQL \
  --location $LOC \
  --admin-user postgres \
  --admin-password "$DB_PASS" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --public-access all -o none

echo "Saving DB secrets to Key Vault..."
az keyvault secret set --vault-name $KV --name "psql-admin-password" --value "$DB_PASS" -o none
az keyvault secret set --vault-name $KV --name "psql-connection-string" --value "postgres://postgres:$DB_PASS@$PSQL.postgres.database.azure.com:5432/postgres?sslmode=require" -o none

# 4. Storage & App Insights
echo "Creating Storage and App Insights..."
az storage account create --name $SA --resource-group $RG --location $LOC --sku Standard_LRS -o none
az monitor log-analytics workspace create --resource-group $RG --workspace-name $LAW -o none
az monitor app-insights component create --app $APPI --location $LOC --resource-group $RG --workspace $LAW -o none

# 5. Apps (Web & Function)
echo "Creating Web App Plan and App..."
az appservice plan create --name $PLAN_WEB --resource-group $RG --location $LOC --sku B1 --is-linux -o none
az webapp create --resource-group $RG --plan $PLAN_WEB --name $APP_WEB --runtime "NODE|20-lts" --assign-identity "[system]" -o none

echo "Creating Function App Plan and App..."
az functionapp create \
  --resource-group $RG \
  --consumption-plan-location $LOC \
  --name $APP_FUNC \
  --storage-account $SA \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --os-type Windows \
  --assign-identity "[system]" -o none

# 6. Key Vault Access Policies for Apps
echo "Granting Apps access to Key Vault..."
WEB_ID=$(az webapp identity show --name $APP_WEB --resource-group $RG --query principalId -o tsv)
FUNC_ID=$(az functionapp identity show --name $APP_FUNC --resource-group $RG --query principalId -o tsv)
az keyvault set-policy --name $KV --object-id $WEB_ID --secret-permissions get list -o none
az keyvault set-policy --name $KV --object-id $FUNC_ID --secret-permissions get list -o none

# 7. GitHub Managed Identity & OIDC
echo "Configuring GitHub Actions Managed Identity..."
az identity create --name $ID_GITHUB --resource-group $RG -o none
GITHUB_CLIENT_ID=$(az identity show --name $ID_GITHUB --resource-group $RG --query clientId -o tsv)
GITHUB_PRINCIPAL_ID=$(az identity show --name $ID_GITHUB --resource-group $RG --query principalId -o tsv)

echo "Granting GitHub Actions Contributor access to Resource Group..."
# Wait a few seconds for the identity to propagate
sleep 15
az role assignment create --assignee $GITHUB_PRINCIPAL_ID --role "Contributor" --scope "/subscriptions/$SUB_ID/resourceGroups/$RG" -o none || echo "Warning: Role assignment might need a retry later."

echo "Creating OIDC Federated Credential..."
az identity federated-credential create \
  --name "github-actions-oidc" \
  --identity-name $ID_GITHUB \
  --resource-group $RG \
  --issuer "https://token.actions.githubusercontent.com" \
  --subject "repo:narayan-mindfire@194910262/vitalparse@1352041635:ref:refs/heads/azure/prod" \
  --audiences "api://AzureADTokenExchange" -o none

echo "✅ Provisioning Complete!"
echo "NEW_GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID" > provision_output.txt
