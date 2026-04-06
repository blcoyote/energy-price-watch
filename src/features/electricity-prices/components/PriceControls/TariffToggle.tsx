export type TariffToggleProps = {
	checked: boolean;
	onChange: (v: boolean) => void;
};

export function TariffToggle({ checked, onChange }: TariffToggleProps) {
	return (
		<div className="control-group">
			<label className="switch-label">
				<input
					type="checkbox"
					role="switch"
					aria-checked={checked}
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className="switch-input"
				/>
				Inkluder tariffer
			</label>
		</div>
	);
}
