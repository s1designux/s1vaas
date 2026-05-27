import styles from './BtnGroup.module.css';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function BtnGroupBtn({ active, className, children, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      className={[styles.btn, active ? styles.active : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

interface BtnGroupRootProps {
  children: React.ReactNode;
  className?: string;
}

type BtnGroupType = React.FC<BtnGroupRootProps> & { Btn: typeof BtnGroupBtn };

const BtnGroup: BtnGroupType = ({ children, className }) => (
  <div className={[styles.btnGroup, className].filter(Boolean).join(' ')}>
    {children}
  </div>
);

BtnGroup.Btn = BtnGroupBtn;

export { BtnGroup };
