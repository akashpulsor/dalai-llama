// @ts-check

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, logout } from "@dalaillama/shared-store";
import { logger } from "@dalaillama/shared-utils";
import { appConfig } from "@dalaillama/shared-config";
import * as KeycloakLib from "keycloak-js";

/**
 * @typedef {import("keycloak-js").KeycloakConfig} KeycloakConfig
 * @typedef {import("keycloak-js").KeycloakInstance} KeycloakInstance
 */

export const useAuthBootstrap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      logger.info("Bootstrapping auth...");

      const currentPath = location?.pathname || "/";
      const publicRoutes = ["/", "/login"];

      const token = localStorage.getItem("auth_token");
      const userJson = localStorage.getItem("user");
      const expiryRaw = localStorage.getItem("token_expiry");

      // -----------------------------------------------------------
      // MOCK MODE — handled by authSlice, so bootstrap does nothing
      // -----------------------------------------------------------
      //if (appConfig.MOCK_MODE) {
      //  return;
      //}

      // -----------------------------------------------------------
      // REAL MODE (KEYCLOAK)
      // -----------------------------------------------------------
      if (!token && !publicRoutes.includes(currentPath)) {
        logger.info("Starting Keycloak login...");

        // FIX: Keycloak has no default constructor in TS type system
        /** @type {any} */
        const KeycloakCtor = KeycloakLib.default || KeycloakLib;

        /** @type {KeycloakConfig} */
        const kcConfig = {
          url: appConfig.KEYCLOAK_URL,
          realm: appConfig.KEYCLOAK_REALM,
          clientId: appConfig.KEYCLOAK_CLIENT,
        };

        /** @type {KeycloakInstance} */
        const keycloak = new KeycloakCtor(kcConfig);

        keycloak
          .init({ onLoad: "login-required" })
          .then(
            /**
             * @param {boolean} authenticated
             */
            (authenticated) => {
              if (!authenticated) {
                keycloak.login();
                return;
              }

              const profile = keycloak.tokenParsed || {};

              const kcUser = {
                id: profile.sub || "",
                name: profile.name || "",
                email: profile.email || "",
                role: profile.realm_access?.roles?.[0] || "agent",
                tenantId: profile.tenantId || "",
              };

              dispatch(setUser({ user: kcUser, token: keycloak.token || "" }));

              localStorage.setItem("user", JSON.stringify(kcUser));
              localStorage.setItem("auth_token", keycloak.token || "");
              localStorage.setItem(
                "token_expiry",
                `${Date.now() + 3600_000}`
              );
            }
          )
          .catch(
            /**
             * @param {any} err
             */
            (err) => {
              console.error("Keycloak failed:", err);
              navigate("/login");
            }
          );

        return;
      }

      // -----------------------------------------------------------
      // TOKEN VALIDATION
      // -----------------------------------------------------------
      if (token) {
        const expired = expiryRaw && Date.now() > Number(expiryRaw);

        if (expired) {
          dispatch(logout());
          navigate("/login");
          return;
        }

        if (userJson) {
          dispatch(setUser({ user: JSON.parse(userJson), token }));
        }
      }
    } catch (err) {
      console.error("Auth bootstrap crashed", err);
      dispatch(logout());
      navigate("/login");
    }
  }, [dispatch, navigate, location]);
};
