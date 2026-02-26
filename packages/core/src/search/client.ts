import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
});

export const INDEX_NAME = 'providers';

export const providerMapping = {
  properties: {
    name: { type: 'text' as const },
    specialties: { type: 'keyword' as const },
    languages: { type: 'keyword' as const },
    location: { type: 'geo_point' as const },
    insurance: { type: 'keyword' as const },
    verification_tier: { type: 'integer' as const },
  },
};
