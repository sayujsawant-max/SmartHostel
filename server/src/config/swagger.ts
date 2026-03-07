import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SmartHostel API',
      version: '1.0.0',
      description: 'API documentation for SmartHostel — a full-stack hostel management platform',
    },
    servers: [
      { url: '/api', description: 'API base path' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT access token in httpOnly cookie (set automatically on login)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication and session management' },
      { name: 'Leaves', description: 'Leave request management' },
      { name: 'Gate', description: 'Gate scanning and pass verification' },
      { name: 'Gate Passes', description: 'Student gate pass retrieval' },
      { name: 'Complaints', description: 'Maintenance complaint management' },
      { name: 'Notifications', description: 'User notification management' },
      { name: 'Notices', description: 'Hostel notice management' },
      { name: 'Admin', description: 'User administration (warden only)' },
      { name: 'Rooms', description: 'Room browsing and management' },
      { name: 'Assistant', description: 'FAQ chatbot assistant' },
      { name: 'Consent', description: 'User consent management' },
      { name: 'Health', description: 'Health checks and system status' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
