export function Card({ children, title }: { children: React.ReactNode, title?: string }) {
  return <div className="card">{title && <h3 className="font-semibold mb-2">{title}</h3>}{children}</div>
}
export function Button({
  children, onClick, className, type
}: { children: React.ReactNode, onClick?: ()=>void, className?: string, type?: 'button'|'submit' }) {
  return <button type={type||'button'} className={`btn ${className||''}`} onClick={onClick}>{children}</button>
}
