import { prisma } from "../configs/prisma-client.config.js";

class AuthRepository {
  register = async (userData) => {
    const createdUserData = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    //const {password:_,...otherUserData}=createdUserData;
    return createdUserData;
  };

  fetchUserByEmail = async (email) => {
    return await prisma.user.findUnique({
      where: {
        email,
      },
    });
  };

  createSession = async (sessionData, refreshToken) => {
    return await prisma.$transaction(async (tx) => {
      const newSession = await tx.session.create({
        data: {
          userId: sessionData?.userId,
          userAgent: sessionData?.userAgent,
          ipAddress: sessionData?.ipAddress,
          deviceInfo: sessionData?.userAgent,
          lastUsedAt:sessionData?.lastUsedAt,
          expiresAt: sessionData?.expiresAt,
        },
      });

      await tx.refreshToken.create({
        data: {
          sessionId: newSession.id,
          token: refreshToken,
          expiresAt: sessionData.expiresAt,
        },
      });

      return newSession;
    });
  };

  fetchRefreshTokenByToken = async (token) => {
    return await prisma.refreshToken.findUnique({
      where: {
        token,
      },
      select: {
        sessionId: true,
      },
    });
  };

  checkRefreshTokenAndOperationSession = async (
    oldToken,
    newToken,
    sessionId,
  ) => {
    // lock the row of session
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
                SELECT id FROM sessions WHERE id=${sessionId}::uuid FOR UPDATE
            `;

      // re-read session after obtaining the lock.
      const getSession = await tx.session.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          user: true,
        },
      });

      if (!getSession) {
        return { status: "INVALID" };
      }

      if (
        getSession.revokedAt ||
        getSession.expiresAt <= new Date() ||
        !getSession.user.isActive
      ) {
        return { status: "INVALID" };
      }

      const getRefreshToken = await tx.refreshToken.findUnique({
        where: {
          token: oldToken,
        },
      });
      if (!getRefreshToken || getRefreshToken.sessionId !== sessionId) {
        return { status: "INVALID" };
      }
      // if refresh token reuse detection
      if (getRefreshToken.consumedAt || getRefreshToken.revokedAt) {
        // revoke entire session
        await tx.session.update({
          where: {
            id: getSession.id,
          },
          data: {
            revokedAt: new Date(),
          },
        });

        // revoke all the refresh token belonging to the session
        await tx.refreshToken.updateMany({
          where: {
            sessionId: getSession.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
        return { status: "REUSED" };
      }
      if (getRefreshToken.expiresAt <= new Date()) {
        return { status: "EXPIRED" };
      }

      // generate the next refresh token record.
      const newRefreshToken = await tx.refreshToken.create({
        data: {
          sessionId: getSession.id,
          token: newToken,
          expiresAt: getSession.expiresAt,
        },
      });

      //mark previous refresh token as consumed.
      await tx.refreshToken.update({
        where: {
          id: getRefreshToken.id,
        },
        data: {
          consumedAt: new Date(),
          replacedById: newRefreshToken.id,
        },
      });

      // update the last used in session
      await tx.session.update({
        where: {
          id: getSession.id,
        },
        data: {
          lastUsedAt: new Date(),
        },
      });

      return {
        status: "SUCCESS",
        userId: getSession.userId,
        sessionId: getSession.id,
      };
    });
    return result;
  };

  updateSessionAndRefreshTokenBySessionId = async (sessionId) => {
    await prisma.$transaction(async (tx) => {
      await tx.session.updateMany({
        where: {
          id: sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  };

  fetchAllSessionAndUpdateSessionAndRefreshTokenByUserId = async (userId) => {
    await prisma.$transaction(async (tx) => {
      const getSessions = await tx.session.findMany({
        where: {
          userId,
          revokedAt: null,
        },
        select: {
          id: true,
        },
      });

      const sessionIds = getSessions.map((session) => session.id);

      await tx.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          sessionId: {
            in: sessionIds,
          },
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  };

  fetchSessionByUserIdAndSessionId = async (sessionId, userId) => {
    return await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
        user: {
          isActive: true,
        },
      },
      select: {
        id: true,
      },
    });
  };

  fetchUserDetailsById = async (userId) => {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });
  };
}
export default new AuthRepository();
