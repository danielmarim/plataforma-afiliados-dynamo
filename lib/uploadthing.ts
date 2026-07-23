import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/lib/auth";

const f = createUploadthing();

/**
 * FileRouter da aplicação.
 * Cada rota define tipos de arquivo, limites e middleware de autorização.
 */
export const ourFileRouter = {
  /** Avatar do usuário (imagem única de até 4 MB). */
  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Não autorizado");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  /** Documentos do afiliado (PDF ou imagem, até 8 MB). */
  affiliateDocument: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 3 },
    image: { maxFileSize: "8MB", maxFileCount: 3 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Não autorizado");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
