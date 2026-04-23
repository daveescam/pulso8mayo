import { route, type Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { s3 } from '@better-upload/server/clients';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const router: Router = {
  client: s3({
     accessKeyId: process.env.R2_ACCESS_KEY_ID!,
     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
     endpoint: process.env.R2_ENDPOINT!,
     region: "auto",
     // Cloudflare R2 signature optimization
     signatureVersion: "v4"
  }),
  bucketName: process.env.R2_BUCKET_NAME!,
  routes: {
    // Endpoint for images uploaded during workflows
    images: route({
      fileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxFileSize: '10MB',
      multipleFiles: true,
      maxFiles: 5,
      // Authentication layer integrating BetterAuth
      authorize: async () => {
        const reqHeaders = await headers();
        const session = await auth.api.getSession({
          headers: reqHeaders
        });
        
        if (!session?.user?.id) {
          throw new Error('Unauthorized');
        }
        
        // Context passes the userId to attach as prefix or metadata if needed
        return { userId: session.user.id };
      }
    }),
  },
};

export const { POST } = toRouteHandler(router);
