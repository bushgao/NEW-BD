import type { UserRole, AuthToken, TokenPayload } from '@ics/shared';
export interface RegisterInput {
    email?: string;
    password: string;
    name: string;
    role: UserRole;
    brandId?: string;
    factoryName?: string;
    phone?: string;
    invitationCode?: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface LoginByPhoneInput {
    phone: string;
    password: string;
}
export interface UserWithoutPassword {
    id: string;
    email: string | null;
    name: string;
    role: UserRole;
    brandId: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    isActive?: boolean;
    isIndependent?: boolean;
    brand?: {
        id: string;
        name: string;
        status: string;
        planType: string;
        planExpiresAt?: Date | null;
        isPaid?: boolean;
        isLocked?: boolean;
        staffLimit: number;
        influencerLimit: number;
        _count?: {
            staff: number;
            influencers: number;
        };
    };
    permissions?: any;
}
/**
 * Register a new user
 */
export declare function register(data: RegisterInput): Promise<{
    user: UserWithoutPassword;
    tokens: AuthToken;
}>;
/**
 * Login user
 */
export declare function login(data: LoginInput): Promise<{
    user: UserWithoutPassword;
    tokens: AuthToken;
}>;
/**
 * Login user by phone number
 */
export declare function loginByPhone(data: LoginByPhoneInput): Promise<{
    user: UserWithoutPassword;
    tokens: AuthToken;
}>;
/**
 * Verify access token
 */
export declare function verifyToken(token: string): TokenPayload;
/**
 * Refresh access token
 */
export declare function refreshToken(refreshTokenStr: string): Promise<AuthToken>;
/**
 * Get current user by ID
 */
export declare function getCurrentUser(userId: string): Promise<UserWithoutPassword>;
//# sourceMappingURL=auth.service.d.ts.map