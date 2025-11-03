import { twMerge } from "tailwind-merge";

interface CodeProps extends React.ComponentProps<"code"> {
  className?: string;
}

const Code = ({ className, ...props }: CodeProps) => {
  return (
    <code
      className={twMerge(
        "rounded-sm bg-muted px-1 py-0.5 font-mono text-0.9em",
        className,
      )}
      {...props}
    />
  );
};

export { Code };
export type { CodeProps };
