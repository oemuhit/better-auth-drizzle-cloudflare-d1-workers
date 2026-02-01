export default defineEventHandler(async (event) => {
    const cloudflare = event.context.cloudflare;
    if (!cloudflare?.env?.BUCKET) {
        return { error: 'No BUCKET binding' };
    }

    try {
        const testKey = 'test-connection.txt';
        const testData = 'Connection working at ' + new Date().toISOString();

        console.log('Testing R2 Put...');
        await cloudflare.env.BUCKET.put(testKey, testData);
        console.log('R2 Put successful');

        return {
            success: true,
            message: 'R2 Put successful',
            key: testKey
        };
    } catch (err: any) {
        console.error('R2 Test Error:', err);
        return {
            success: false,
            error: err.message,
            stack: err.stack
        };
    }
})
