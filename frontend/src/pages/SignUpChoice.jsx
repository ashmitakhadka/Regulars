import { faUser, faStore } from "@fortawesome/free-solid-svg-icons";
import { AuthChoiceLayout } from "../components/ui/AuthChoiceLayout";

export const SignUpChoice = () => {
  return (
    <AuthChoiceLayout
      title="Join Regulars"
      subtitle="Choose how you want to get started with Regulars."
      customerOption={{
        icon: faUser,
        title: "I'm a customer",
        text: "Create one account and keep all your loyalty cards in one place.",
        buttonLabel: "Create customer account",
        to: "/register",
      }}
      businessOption={{
        icon: faStore,
        title: "I own a business",
        text: "Set up your shop and start rewarding your regulars.",
        buttonLabel: "Register my business",
        to: "/merchant/register",
      }}
      footerPrompt="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/sign-in"
    />
  );
};

export default SignUpChoice;
