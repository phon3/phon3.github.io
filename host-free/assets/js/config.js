/**
 * kvdb.io Configuration
 * Free tier: 10,000 operations/month
 * Documentation: https://kvdb.io/docs/api/
 */

const KVDBConfig = {
    // Default bucket for testing - users should create their own at kvdb.io
    bucketId: 'J3ZKh5VubrrKfLe5qcPEBJ',
    endpoint: 'https://kvdb.io',

    /**
     * Gets the full API URL for a given key
     * @param {string} key 
     * @returns {string}
     */
    getURL: (key) => {
        return `${KVDBConfig.endpoint}/${KVDBConfig.bucketId}/${key}`;
    }
};
