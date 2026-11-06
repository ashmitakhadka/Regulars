export const Card = ({
  children,
  className = "",
  padding = "p-5 sm:p-6",
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl bg-white ${padding} shadow-[0_2px_12px_rgba(43,17,20,0.06)] transition ${
        onClick ? "cursor-pointer hover:shadow-[0_4px_16px_rgba(43,17,20,0.09)]" : ""
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

