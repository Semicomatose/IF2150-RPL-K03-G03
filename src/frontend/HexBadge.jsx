import React from "react";

export default function HexBadge({ value, title }) {
	return (
		<svg className="hexagon-badge" width="32" height="32" viewBox="0 -0.5 32 34" role="img" aria-label={title}>
			{title && <title>{title}</title>}
			<polygon points="8,0 24,0 32,16 24,32 8,32 0,16" fill="#1c1e29" stroke="#474a5f" strokeWidth="1" />
			<text x="16" y="17" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
				{value}
			</text>
		</svg>
	);
}
