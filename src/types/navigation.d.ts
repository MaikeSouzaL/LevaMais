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
      CompleteRegistration: {
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
        userType: "client" | "driver";
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
    }
  }
}
