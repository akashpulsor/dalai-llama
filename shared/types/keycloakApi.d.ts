declare module "@dalaillama/shared-hooks/keycloakApi" {
  /* -------------------------------------------------------------------------- */
  /*                               Type Definitions                             */
  /* -------------------------------------------------------------------------- */

  /** Token response from Keycloak (standard OIDC) */
  export interface KeycloakTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    id_token?: string;
    scope?: string;
  }

  /** Request: Register new user */
  export interface RegisterUserRequest {
    email: string;
    firstName?: string;
    lastName?: string;
    password: string;
  }

  /** Request: Reset password */
  export interface ResetPasswordRequest {
    email: string;
  }

  /** Token exchange request (for PKCE flow) */
  export interface ExchangeTokenRequest {
    code: string;
    state: string;
  }

  /** PKCE initiate login request */
  export interface InitiateLoginRequest {
    email?: string;
  }

  /** Refresh token request */
  export type RefreshTokenRequest = void;

  /** Logout request */
  export type LogoutRequest = void;

  /** Generic user info returned from Keycloak */
  export interface KeycloakUserInfo {
    sub: string;
    name?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
  }

  /** Generic mutation result helper */
  export interface MutationResult<T> extends Promise<T> {
    unwrap(): Promise<T>;
  }

  /* -------------------------------------------------------------------------- */
  /*                                Legacy Hooks                                */
  /* -------------------------------------------------------------------------- */

  /** Direct username/password login (legacy flow) */
  export function useLoginMutation(): [
    (args: { username: string; password: string }) => MutationResult<KeycloakTokenResponse>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /** Refresh token (both PKCE + legacy) */
  export function useRefreshTokenMutation(): [
    (args?: RefreshTokenRequest) => MutationResult<KeycloakTokenResponse>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /** Register user directly (admin or open registration realm) */
  export function useRegisterUserMutation(): [
    (args: RegisterUserRequest) => MutationResult<{ success?: boolean }>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /** Trigger password reset email (admin flow) */
  export function useResetPasswordMutation(): [
    (args: ResetPasswordRequest) => MutationResult<{ success?: boolean }>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /* -------------------------------------------------------------------------- */
  /*                             Modern PKCE/OIDC Hooks                         */
  /* -------------------------------------------------------------------------- */

  /** Step 1: Initiate PKCE login (redirects user to Keycloak) */
  export function useInitiateLoginMutation(): [
    (args?: InitiateLoginRequest) => MutationResult<{ redirecting: boolean }>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /** Step 2: Exchange authorization code for tokens */
  export function useExchangeTokenMutation(): [
    (args: ExchangeTokenRequest) => MutationResult<KeycloakTokenResponse>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /** Logout from Keycloak session */
  export function useKeycloakLogoutMutation(): [
    (args?: LogoutRequest) => MutationResult<{ success?: boolean }>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /** Retrieve user info via /userinfo endpoint */
  export function useGetUserInfoQuery(
    accessToken: string
  ): {
    data?: KeycloakUserInfo;
    isLoading: boolean;
    isError: boolean;
    error?: unknown;
  };

  /* -------------------------------------------------------------------------- */
  /*                            Redirect Convenience Hooks                      */
  /* -------------------------------------------------------------------------- */

  /** Redirect to Keycloak-hosted self-registration page */
  export function useRegisterRedirectMutation(): [
    () => MutationResult<{ redirecting: boolean }>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];

  /** Redirect to Keycloak-hosted forgot password page */
  export function useResetPasswordRedirectMutation(): [
    () => MutationResult<{ redirecting: boolean }>,
    { isLoading: boolean; isError: boolean; error?: unknown }
  ];
}
