import { prisma } from "../configs/prismaclient.config.js"

class AuthRepository {
    fetchUserByEmail = async (email) => {
        return await prisma.user.findUnique({
            where: {
                email
            }
        });
    }

    createSession = async (sessionData, refreshToken) => {
        return await prisma.$transaction(async (tx) => {
            const newSession = await tx.session.create({
                data: {
                    userId: sessionData.id,
                    userAgent: sessionData.userAgent,
                    ipAddress: sessionData.ipAddress,
                    deviceInfo: sessionData.userAgent,
                    expiresAt: sessionData.expiresAt,
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
    }
}
export default new AuthRepository();