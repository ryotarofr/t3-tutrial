import { clerkClient } from "@clerk/nextjs";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import type { User } from '@clerk/nextjs/dist/types/server';
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Ratelimit } from "@upstash/ratelimit";
import {Redis} from "@upstash/redis"

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  }
}

// 1分間に3回のリクエストを許可する
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  timeout: 1000, // 1 second
  analytics: true
});

export const postsRouter = createTRPCRouter({

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy:[{ createdAt: "desc"}]
    });

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
    ).map(filterUserForClient)

    console.log(users);
    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId)
      
      if (!author || !author.username)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "まだポスト投稿がありません",
        })
      return{
        post,
        author:{
          ...author,
          username: author.username
        },
    }})  
  }),

  // tRPCでコンテンツを作成
  create: privateProcedure.input(z.object({
    content: z.string().min(1).max(160),
  })).mutation(async ({ ctx, input }) => {
    const authorId = ctx.userId

    const {success} = await ratelimit.limit(authorId)
    if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"})

    const post = await ctx.prisma.post.create({
      data: {
        authorId,
        content: input.content,
      }
    })
    return post
  })
});
