import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Button } from "./Button";

const BackButton = ({ to, iconOnly = false, size = "md" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button variant="soft" size={size} onClick={handleBack}>
      <FontAwesomeIcon icon={faArrowLeft} />
      {!iconOnly && "Back"}
    </Button>
  );
};

export default BackButton;
