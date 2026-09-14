import { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import { FastifySwaggerUiOptions } from "@fastify/swagger-ui";
import { logger } from "../shared/logger";

export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  openapi: {
    openapi: "3.0.3",
    info: {
      title: "Flowline Modular Backend API (Free-Tier Monolith)",
      description:
        "Migration-ready modular monolith built for ~100 independent companies on 100% free resources ($0/month) with Row-Level Security, bounded domain modules, and in-process event bus.",
      version: "1.0.0",
    },
    servers: [
      { url: "http://localhost:4000", description: "Local Modular Monolith" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT authentication token.",
        },
        CompanyTenantHeader: {
          type: "apiKey",
          in: "header",
          name: "x-company-id",
          description:
            "Tenant isolation key (defaults to Acme Corp if omitted).",
        },
      },
    },
    security: [{ BearerAuth: [], CompanyTenantHeader: [] }],
  },
};

export const swaggerUiConfig: FastifySwaggerUiOptions = {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
};
