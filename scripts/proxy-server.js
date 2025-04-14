const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 3000;
const TEAM_ID = process.env.TEAM_ID || '';

// Enable CORS for all routes
app.use(cors());

// Parse JSON request body
app.use(bodyParser.json());

// Common headers for thirdweb API requests
const getHeaders = () => ({
  'Next-Action': process.env.NEXT_ACTION_TOKEN || '',
  'host': 'thirdweb.com',
  'Content-Type': 'application/json',
  'Cookie': process.env.TW_COOKIE || ''
});

// Shared API request function
async function makeApiRequest(data, logMessage) {
  console.log(logMessage);
  
  try {
    const response = await axios.post('https://thirdweb.com/', data, {
      headers: getHeaders()
    });
    
    console.log('Response received');
    return response;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
}

// Error handler function
function handleError(res, error) {
  if (error.response) {
    res.status(error.response.status).json({
      error: error.message,
      data: error.response.data
    });
  } else {
    res.status(500).json({ error: error.message });
  }
}

// Endpoint to create a project
app.post('/api/create-project', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    const response = await makeApiRequest(
      req.body, 
      'Creating project'
    );
    
    res.json(response.data);
  } catch (error) {
    handleError(res, error);
  }
});

// Endpoint to get all projects
app.get('/api/list-projects', async (req, res) => {
  try {
    const data = [{
      pathname: `/v1/teams/${TEAM_ID}/projects`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }];
    
    const response = await makeApiRequest(
      data, 
      'Fetching all projects'
    );
    
    // Parse the response data to extract just the projects object
    if (response.data && response.data[1] && response.data[1].data && response.data[1].data.result) {
      // Return just the meaningful part of the response
      res.json({ projects: response.data[1].data.result });
    } else {
      console.log('Projects fetched with unexpected format:', response.data);
      // Return the full response as is for debugging
      res.json(response.data);
    }
  } catch (error) {
    handleError(res, error);
  }
});

// Endpoint to delete a project
app.delete('/api/delete-project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const projectName = req.query.name || 'Unknown';
    
    const data = [{
      pathname: `/v1/teams/${TEAM_ID}/projects/${projectId}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    }];
    
    const response = await makeApiRequest(
      data, 
      `Deleting project with ID: ${projectId}, name: ${projectName}`
    );
    
    // Simple success check - if we got a response, consider it successful
    let success = true;
    let message = `Project "${projectName}" deleted successfully`;
    
    // Only do minimal error checking for 404 case
    if (typeof response.data === 'string' && response.data.includes('404')) {
      success = false;
      message = `Project "${projectName}" not found or already deleted`;
    }
    
    res.json({
      success,
      message,
      projectId
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Endpoint to update project settings
app.put('/api/update-project-settings/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const projectName = req.query.name || 'Unknown';
    const { maxSpend, allowedContractAddresses, allowedWallets, blockedWallets } = req.body;
    
    // Helper function to handle [""] arrays that should be empty
    const normalizeArray = (arr) => {
      if (!arr) return [];
      if (Array.isArray(arr) && arr.length === 1 && arr[0] === "") return [];
      return arr;
    };
    
    const data = [{
      pathname: `/v1/teams/${TEAM_ID}/projects/${projectId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        services: [
          {
            name: 'bundler',
            actions: [],
            allowedChainIds: [4202],
            allowedContractAddresses: normalizeArray(allowedContractAddresses),
            allowedWallets: normalizeArray(allowedWallets),
            blockedWallets: normalizeArray(blockedWallets),
            bypassWallets: [],
            limits: {
              global: {
                maxSpend: maxSpend.toString(),
                maxSpendUnit: 'usd'
              }
            },
            serverVerifier: null
          },
          { name: 'chainsaw', actions: [] },
          { name: 'embeddedWallets', actions: [], applicationName: 'embeddedWallets', recoveryShareManagement: 'AWS_MANAGED' },
          { name: 'insight', actions: [] },
          { name: 'pay', actions: [], developerFeeBPS: 70 },
          { name: 'relayer', actions: [] },
          { name: 'rpc', actions: [] },
          { name: 'storage', actions: ['read', 'write'] }
        ]
      })
    }];
    
    const response = await makeApiRequest(
      data,
      `Updating settings for project with ID: ${projectId}, name: ${projectName}`
    );
    
    // Simple success check - if we got a response, consider it successful
    let success = true;
    let message = `Settings for project "${projectName}" updated successfully`;
    
    // Basic error checking
    if (typeof response.data === 'string' && response.data.includes('404')) {
      success = false;
      message = `Project "${projectName}" not found`;
    }
    
    res.json({
      success,
      message,
      projectId
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
}); 