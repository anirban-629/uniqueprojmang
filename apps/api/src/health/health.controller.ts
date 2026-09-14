import { FastifyRequest, FastifyReply } from "fastify";
import { healthService } from "./health.service.js";

export async function getHealth(_request: FastifyRequest, reply: FastifyReply) {
  const result = await healthService.getFullHealth();
  const statusCode = result.status === "healthy" ? 200 : 503;
  return reply.status(statusCode).send(result);
}
