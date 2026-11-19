import { faUser, faStore } from "@fortawesome/free-solid-svg-icons";
import { AuthChoiceLayout } from "../components/ui/AuthChoiceLayout";

export const SignInChoice = () => {
  return (
    <AuthChoiceLayout
      title="Welcome back to Regulars"
      subtitle="Choose how you'd like to sign in today."
      customerOption={{
        icon: faUser,
        title: "I'm a customer",
        text: "Check your stamps, streaks and rewards from every shop you visit.",
        buttonLabel: "Log in as customer",
        to: "/login",
      }}
      businessOption={{
        icon: faStore,
        title: "I own a business",
        text: "Manage your loyalty programs, customers and rewards.",
        buttonLabel: "Log in as business",
        to: "/merchant/login",
      }}
      footerPrompt="New here?"
      footerLinkText="Create an account"
      footerLinkTo="/sign-up"
    />
  );
};

export default SignInChoice;
