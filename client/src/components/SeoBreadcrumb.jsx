import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './SeoBreadcrumb.css';

/**
 * @param {{ items: { name: string, to?: string }[] }} props
 * Last item is current page (no link).
 */
export default function SeoBreadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="seo-breadcrumb" aria-label="Breadcrumb">
      <ol className="seo-breadcrumb-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="seo-breadcrumb-item">
              {i === 0 && <Home size={14} aria-hidden className="seo-breadcrumb-home" />}
              {isLast || !item.to ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link to={item.to}>{item.name}</Link>
              )}
              {!isLast && <ChevronRight size={14} aria-hidden className="seo-breadcrumb-sep" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
