import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../shared/errors/index.js';

const errorHandlerPluginAsync: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        request.log.error(error);
      }
      return reply.status(error.statusCode).send({
        error: error.message,
        details: error.details
      });
    }

    const err = error as Record<string, any>;

    // Fastify native schema validation errors
    if (err && err.validation) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: err.validation
      });
    }

    if (error instanceof Error) {
      request.log.error(error);
      return reply.status(err?.statusCode || 500).send({
        error: error.message || 'Internal Server Error'
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal Server Error'
    });
  });
};

export const errorHandlerPlugin = fp(errorHandlerPluginAsync, {
  name: 'flowline-error-handler'
});
