export default function Badge({ children, variant = 'gray' }) {
  const variants = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + variants[variant]}>
      {children}
    </span>
  );
}
