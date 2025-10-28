/**
 * Component to display mathematical formulas with proper fractions
 * Converts "A / B" into a visual fraction with numerator over denominator
 */

interface FractionFormulaProps {
  formula: string;
  className?: string;
}

export function FractionFormula({ formula, className = "" }: FractionFormulaProps) {
  // Split formula by division symbol
  const parts = formula.split('/');
  
  // If no division, just return the formula as-is
  if (parts.length === 1) {
    return (
      <span className={`font-mono ${className}`} data-testid="text-formula">
        {formula}
      </span>
    );
  }
  
  // If formula contains division, render as fraction
  if (parts.length === 2) {
    const numerator = parts[0].trim();
    const denominator = parts[1].trim();
    
    return (
      <div className={`inline-flex flex-col items-center ${className}`} data-testid="text-formula">
        <div className="text-xs font-mono text-center px-1">
          {numerator}
        </div>
        <div className="w-full h-[1px] bg-current my-0.5"></div>
        <div className="text-xs font-mono text-center px-1">
          {denominator}
        </div>
      </div>
    );
  }
  
  // For more complex formulas, just display as-is
  return (
    <span className={`font-mono ${className}`} data-testid="text-formula">
      {formula}
    </span>
  );
}
