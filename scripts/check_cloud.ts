import axios from 'axios';

async function checkStatus() {
  try {
    // 1. Check health
    const health = await axios.get('http://localhost:3000/api/health');
    console.log('HEALTH:', health.data);

    // 2. Try a test sync
    console.log('Attempting test sync via /api/products...');
    const testProduct = {
        sku: 'TEST_SKU_123',
        nombre_comercial: 'TEST PRODUCT',
        skus_relacionados: ['REL_1', 'REL_2'],
        last_updated: Date.now()
    };
    const postRes = await axios.post('http://localhost:3000/api/products', testProduct);
    console.log('POST RESULT:', postRes.data);

    // 3. Check cloud status
    const response = await axios.get('http://localhost:3000/api/cloud-status');
    console.log('CLOUD STATUS:', JSON.stringify(response.data, null, 2));

    // 4. Cleanup test product
    if (postRes.data.success) {
        console.log('Cleaning up test product...');
        await axios.delete('http://localhost:3000/api/products/TEST_SKU_123');
    }

  } catch (error: any) {
    console.error('ERROR:', error.message);
    if (error.response) {
       console.error('RESPONSE DATA:', error.response.data);
    }
  }
}

checkStatus();
