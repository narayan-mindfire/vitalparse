#!/bin/bash
set -e

RG="rg-vitalparse-dev-centralindia"
LOC="centralindia"
SA="stvitalparsedevcin"
PLAN_WEB="plan-web-vitalparse-dev-cin"
APP_WEB="app-web-vitalparse-dev-cin"
APP_FUNC="func-vitalparse-dev-cin"
ID_GITHUB="id-vitalparse-github-cin"
ID_APPS="id-vitalparse-apps-cin"
KV="kv-vitalparse-dev-cin"
SUB_ID=$(az account show --query id -o tsv)

echo "Resuming at Web App Creation with Node 22..."
az webapp create --resource-group $RG --plan $PLAN_WEB --name $APP_WEB --runtime "NODE|22-lts" --assign-identity "[system]" -o none

echo "Creating Function App Plan and App with Node 22..."
az functionapp create \
  --resource-group $RG \
  --consumption-plan-location $LOC \
  --name $APP_FUNC \
  --storage-account $SA \
  --runtime node \
  --runtime-version 22 \
  --functions-version 4 \
  --os-type Windows \
  --assign-identity "[system]" -o none

echo "Granting Apps access to Key Vault..."
WEB_ID=$(az webapp identity show --name $APP_WEB --resource-group $RG --query principalId -o tsv)
FUNC_ID=$(az functionapp identity show --name $APP_FUNC --resource-group $RG --query principalId -o tsv)
az keyvault set-policy --name $KV --object-id $WEB_ID --secret-permissions get list -o none
az keyvault set-policy --name $KV --object-id $FUNC_ID --secret-permissions get list -o none

echo "Configuring GitHub Actions Managed Identity..."
az identity create --name $ID_GITHUB --resource-group $RG -o none
GITHUB_CLIENT_ID=$(az identity show --name $ID_GITHUB --resource-group $RG --query clientId -o tsv)
GITHUB_PRINCIPAL_ID=$(az identity show --name $ID_GITHUB --resource-group $RG --query principalId -o tsv)

echo "Granting GitHub Actions Contributor access to Resource Group..."
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
