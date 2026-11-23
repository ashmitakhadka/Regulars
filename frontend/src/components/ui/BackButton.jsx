import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Button } from "./Button";

export const BackButton = ({
  to,
  iconOnly = false,
  size,
  className = "",
  ariaLabel = "Go back",
  ...props
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const resolvedSize = size || (iconOnly ? "xs" : "md");

  return (
    <Button
      variant="soft"
      size={resolvedSize}
      onClick={handleBack}
      className={className}
      aria-label={ariaLabel}
      {...props}
    >
      <FontAwesomeIcon icon={faArrowLeft} />
      {!iconOnly && "Back"}
    </Button>
  );
};

export default BackButton;
