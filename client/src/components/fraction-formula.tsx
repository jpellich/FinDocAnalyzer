
/**
 * Component to display mathematical formulas with proper fractions
 * Converts "Coefficient = A / B" into a visual display with coefficient name, equals sign, and fraction
 */

interface FractionFormulaProps {
  formula: string;
  className?: string;
}

export function FractionFormula({ formula, className = "" }: FractionFormulaProps) {
  // Check if formula contains an equals sign
  const equalsIndex = formula.indexOf('=');
  
  if (equalsIndex === -1) {
    // No equals sign, display as-is
    return (
      <span className={`font-mono text-xs ${className}`} data-testid="text-formula">
        {formula}
      </span>
    );
  }
  
  // Split by equals sign
  const coefficient = formula.substring(0, equalsIndex).trim();
  const expression = formula.substring(equalsIndex + 1).trim();
  
  // Split expression by division symbol
  const parts = expression.split('/');
  
  // If no division in the expression, display without fraction
  if (parts.length === 1) {
    return (
      <div className={`flex items-center gap-2 ${className}`} data-testid="text-formula">
        <span className="font-mono text-xs">{coefficient}</span>
        <span className="font-mono text-xs">=</span>
        <span className="font-mono text-xs">{expression}</span>
      </div>
    );
  }
  
  // Display with fraction
  if (parts.length === 2) {
    const numerator = parts[0].trim();
    const denominator = parts[1].trim();
    
    return (
      <div className={`flex items-center gap-2 ${className}`} data-testid="text-formula">
        <span className="font-mono text-xs whitespace-nowrap">{coefficient}</span>
        <span className="font-mono text-xs">=</span>
        <div className="inline-flex flex-col items-center">
          <div className="text-xs font-mono text-center px-1 whitespace-nowrap">
            {numerator}
          </div>
          <div className="w-full h-[1px] bg-current my-0.5"></div>
          <div className="text-xs font-mono text-center px-1 whitespace-nowrap">
            {denominator}
          </div>
        </div>
      </div>
    );
  }
  
  // For more complex formulas, just display as-is
  return (
    <span className={`font-mono text-xs ${className}`} data-testid="text-formula">
      {formula}
    </span>
  );
}
