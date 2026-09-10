param location string = resourceGroup().location
param webAppName string = 'app-web-vitalparse-dev-cin'
param funcAppName string = 'func-vitalparse-dev-cin'
param pgName string = 'psql-vitalparse-dev-cin'
param kvName string = 'kv-vitalparse-dev-cin'
param saName string = 'stvitalparsedevcin'
param lawName string = 'law-vitalparse-dev-cin'
param appiName string = 'appi-vitalparse-dev-cin'

resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: saName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: lawName
  location: location
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appiName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: pgName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    storage: { storageSizeGB: 32 }
  }
}

// 4. Key Vault (Switched to RBAC to prevent access wipe)
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: kvName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
  }
}

// Key Vault Secrets User Role Assignments
resource kvRoleWebApp 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource kvRoleFuncApp 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, funcApp.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: funcApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource webPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-web-vitalparse-dev-cin'
  location: location
  sku: { name: 'B1' }
  kind: 'linux'
  properties: { reserved: true }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: webPlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appCommandLine: 'npm run start:api'
      healthCheckPath: '/api/health'
      appSettings: [
        { name: 'PORT', value: '8080' }
        { name: 'DB_HOST', value: postgres.properties.fullyQualifiedDomainName }
        { name: 'DB_PORT', value: '5432' }
        { name: 'DB_NAME', value: 'postgres' }
        { name: 'DB_USER', value: 'postgres' }
        { name: 'DB_SSL', value: 'true' }
        { name: 'DB_PASSWORD', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=psql-admin-password)' }
        { name: 'GEMINI_API_KEY', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=gemini-api-key)' }
        { name: 'LOGIC_APP_URL', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=logic-app-url)' }
        { name: 'AZURE_FUNCTION_URL', value: 'https://${funcAppName}.azurewebsites.net/api/process-document' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'ApplicationInsightsAgent_EXTENSION_VERSION', value: '~3' }
        { name: 'XDT_MicrosoftApplicationInsights_NodeJS', value: '1' }
      ]
    }
  }
  identity: { type: 'SystemAssigned' }
}

resource funcPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-func-vitalparse-dev-cin'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

resource funcApp 'Microsoft.Web/sites@2022-09-01' = {
  name: funcAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: funcPlan.id
    siteConfig: {
      netFrameworkVersion: 'v8.0'
      nodeVersion: '~22'
      appSettings: [
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'GEMINI_API_KEY', value: '@Microsoft.KeyVault(VaultName=${kvName};SecretName=gemini-api-key)' }
      ]
    }
  }
  identity: { type: 'SystemAssigned' }
}
