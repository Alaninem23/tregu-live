/**
 * System Card Component
 * Displays a single ERP/WMS/CRM system tile with custom icon and hover effects
 */

'use client';

import Link from 'next/link';
import { SystemTile } from '@/types/enterprise';
import { TreguIcons } from '@/icons/tregu';
import { ICON } from '@/lib/icon-tokens';

interface SystemCardProps {
  tile: SystemTile;
}

export default function SystemCard({ tile }: SystemCardProps) {
  const Icon = TreguIcons[tile.icon];
  
  return (
    <Link
      href={tile.route}
      className="group rounded-2xl border border-gray-200 bg-white hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md p-5 flex gap-3"
    >
      {/* Icon */}
      <div className="mt-0.5 text-gray-700 group-hover:text-blue-600 transition-colors flex-shrink-0">
        {Icon ? <Icon size={ICON.sizeTile} /> : null}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {tile.label}
          </h3>
          <span className="text-xs rounded bg-gray-100 px-2 py-0.5 text-gray-600 font-medium">
            Open
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{tile.description}</p>
      </div>
    </Link>
  );
}

