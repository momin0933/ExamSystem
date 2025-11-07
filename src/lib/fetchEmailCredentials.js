import config from '@/config';
import https from 'https';

export const fetchEmailCredentials = async (tenantId) => {
  
  try {
    // Use axios for better SSL handling
    const axios = (await import('axios')).default;

    const response = await axios.post(
      `${config.API_BASE_URL}api/Procedure/GetData`,
      {
        operation: "",
        procedureName: "SP_EmailManage",
        parameters: { QueryChecker: 1 },
      },
      {
        headers: {
          TenantId: tenantId || "",
          "Content-Type": "application/json",
        },
        // Bypass SSL verification for development
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 10000 
      }
    );

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No active email credentials found");
    }

    const { Email, AppPass } = data[0];
    
    if (!Email || !AppPass) {
      throw new Error("Invalid email credentials format from database");
    }

    console.log("Successfully fetched email credentials for:", Email);
    return { Email, AppPass };
    
  } catch (error) {
    console.error("Error fetching email credentials:", error.message);
    
    // Provide more specific error messages
    if (error.code === 'ECONNREFUSED') {
      throw new Error("Cannot connect to database server");
    } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      throw new Error("SSL certificate verification failed");
    } else if (error.response) {
      throw new Error(`Database API error: ${error.response.status}`);
    }
    
    throw new Error(error.message || "Error loading email credentials from database");
  }
};