export declare global {
  namespace ReactNavigation {
    interface RootParamList {
      IntroScreen: undefined;
      SignIn: undefined;
      SignUp: undefined;
      SelectProfile: {
        user: {
          _id?: string;
          name: string;
          email: string;
          password: string;
          phone?: string;
          city?: string;
          userType?: string;
          googleId?: string;
          profilePhoto?: string;
          acceptedTerms: boolean;
        };
        token?: string;
      };
      /** @deprecated Rota antiga (cadastro unificado). Mantida só para não quebrar builds antigos. */
      CompleteRegistration?: never;
      CompleteRegistrationClient: {
        user: {
          _id?: string;
          name: string;
          email: string;
          password: string;
          phone?: string;
          city?: string;
          userType?: string;
          googleId?: string;
          profilePhoto?: string;
          acceptedTerms: boolean;
        };
        token?: string;
      };

      CompleteRegistrationDriver: {
        user: {
          _id?: string;
          name: string;
          email: string;
          password: string;
          phone?: string;
          city?: string;
          userType?: string;
          googleId?: string;
          profilePhoto?: string;
          acceptedTerms: boolean;
        };
        token?: string;
        selectedProfile: "client" | "driver";
      };
      ForgotPassword: undefined;
      VerifyCode: {
        email: string;
      };
      NewPassword: {
        email: string;
        code: string;
      };
      Terms: {
        onAccept?: () => void;
      };
      NotificationPermission: {
        user: {
          _id: string;
          name: string;
          email: string;
          phone: string;
          userType: string;
          cidade: string;
        };
        token: string;
      };
    }
  }
}
