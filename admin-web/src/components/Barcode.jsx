import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function Barcode({ value, height = 42, width = 1.6, fontSize = 12, displayValue = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, String(value), {
          format: 'CODE128',
          height,
          width,
          fontSize,
          displayValue,
          margin: 4,
        });
      } catch (e) { /* bỏ qua */ }
    }
  }, [value, height, width, fontSize, displayValue]);
  return <svg ref={ref} />;
}
