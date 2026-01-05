import { TRPCError } from '@trpc/server';
import debug from 'debug';
import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { marketSDK, marketUserInfo, serverDatabase } from '@/libs/trpc/lambda/middleware';

const log = debug('lambda-router:market:agent');

// Authenticated procedure for agent management
// Requires user to be logged in and has MarketSDK initialized
const agentProcedure = authedProcedure
  .use(serverDatabase)
  .use(marketUserInfo)
  .use(marketSDK);

// Schema definitions
const createAgentSchema = z.object({
  homepage: z.string().optional(),
  identifier: z.string(),
  isFeatured: z.boolean().optional(),
  name: z.string(),
  status: z.enum(['published', 'unpublished', 'archived', 'deprecated']).optional(),
  tokenUsage: z.number().optional(),
  visibility: z.enum(['public', 'private', 'internal']).optional(),
});

const createAgentVersionSchema = z.object({
  a2aProtocolVersion: z.string().optional(),
  avatar: z.string().optional(),
  category: z.string().optional(),
  changelog: z.string().optional(),
  config: z.record(z.any()).optional(),
  defaultInputModes: z.array(z.string()).optional(),
  defaultOutputModes: z.array(z.string()).optional(),
  description: z.string().optional(),
  documentationUrl: z.string().optional(),
  extensions: z.array(z.record(z.any())).optional(),
  hasPushNotifications: z.boolean().optional(),
  hasStateTransitionHistory: z.boolean().optional(),
  hasStreaming: z.boolean().optional(),
  identifier: z.string(),
  interfaces: z.array(z.record(z.any())).optional(),
  name: z.string().optional(),
  preferredTransport: z.string().optional(),
  providerId: z.number().optional(),
  securityRequirements: z.array(z.record(z.any())).optional(),
  securitySchemes: z.record(z.any()).optional(),
  setAsCurrent: z.boolean().optional(),
  summary: z.string().optional(),
  supportsAuthenticatedExtendedCard: z.boolean().optional(),
  tokenUsage: z.number().optional(),
  url: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export const agentRouter = router({
  /**
   * Create a new agent in the marketplace
   * POST /market/agent/create
   */
  createAgent: agentProcedure.input(createAgentSchema).mutation(async ({ input, ctx }) => {
    log('createAgent input: %O', input);

    try {
      const response = await ctx.marketSDK.agents.createAgent(input);
      return response;
    } catch (error) {
      log('Error creating agent: %O', error);
      throw new TRPCError({
        cause: error,
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create agent',
      });
    }
  }),

  /**
   * Create a new version for an existing agent
   * POST /market/agent/versions/create
   */
  createAgentVersion: agentProcedure
    .input(createAgentVersionSchema)
    .mutation(async ({ input, ctx }) => {
      log('createAgentVersion input: %O', input);

      try {
        const response = await ctx.marketSDK.agents.createAgentVersion(input);
        return response;
      } catch (error) {
        log('Error creating agent version: %O', error);
        throw new TRPCError({
          cause: error,
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create agent version',
        });
      }
    }),

  /**
   * Deprecate an agent (permanently hide, cannot be republished)
   * POST /market/agent/:identifier/deprecate
   */
  deprecateAgent: agentProcedure
    .input(z.object({ identifier: z.string() }))
    .mutation(async ({ input, ctx }) => {
      log('deprecateAgent input: %O', input);

      try {
        const response = await ctx.marketSDK.agents.deprecate(input.identifier);
        return response ?? { success: true };
      } catch (error) {
        log('Error deprecating agent: %O', error);
        throw new TRPCError({
          cause: error,
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deprecate agent',
        });
      }
    }),

  /**
   * Get agent detail by identifier
   * GET /market/agent/:identifier
   */
  getAgentDetail: agentProcedure
    .input(z.object({ identifier: z.string() }))
    .query(async ({ input, ctx }) => {
      log('getAgentDetail input: %O', input);

      try {
        const response = await ctx.marketSDK.agents.getAgentDetail(input.identifier);
        return response;
      } catch (error) {
        log('Error getting agent detail: %O', error);
        throw new TRPCError({
          cause: error,
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get agent detail',
        });
      }
    }),

  /**
   * Get own agents (requires authentication)
   * GET /market/agent/own
   */
  getOwnAgents: agentProcedure.input(paginationSchema.optional()).query(async ({ input, ctx }) => {
    log('getOwnAgents input: %O', input);

    try {
      const response = await ctx.marketSDK.agents.getOwnAgents({
        page: input?.page,
        pageSize: input?.pageSize,
      });
      return response;
    } catch (error) {
      log('Error getting own agents: %O', error);
      throw new TRPCError({
        cause: error,
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get own agents',
      });
    }
  }),

  /**
   * Publish an agent (make it visible in marketplace)
   * POST /market/agent/:identifier/publish
   */
  publishAgent: agentProcedure
    .input(z.object({ identifier: z.string() }))
    .mutation(async ({ input, ctx }) => {
      log('publishAgent input: %O', input);

      try {
        const response = await ctx.marketSDK.agents.publish(input.identifier);
        return response ?? { success: true };
      } catch (error) {
        log('Error publishing agent: %O', error);
        throw new TRPCError({
          cause: error,
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to publish agent',
        });
      }
    }),

  /**
   * Unpublish an agent (hide from marketplace, can be republished)
   * POST /market/agent/:identifier/unpublish
   */
  unpublishAgent: agentProcedure
    .input(z.object({ identifier: z.string() }))
    .mutation(async ({ input, ctx }) => {
      log('unpublishAgent input: %O', input);

      try {
        const response = await ctx.marketSDK.agents.unpublish(input.identifier);
        return response ?? { success: true };
      } catch (error) {
        log('Error unpublishing agent: %O', error);
        throw new TRPCError({
          cause: error,
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to unpublish agent',
        });
      }
    }),
});

export type AgentRouter = typeof agentRouter;
