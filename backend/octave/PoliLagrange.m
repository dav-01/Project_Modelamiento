% PoliLagrange.m
% Calcula el valor interpolado en x usando el polinomio de Lagrange.
% Entradas:
%   x : valor en el que se desea interpolar
%   X : vector de valores de x conocidos
%   Y : vector de valores de y correspondientes a X
% Salida:
%   y : valor interpolado en x

function y = PoliLagrange(x, X, Y)
  y = 0; % Inicializa el resultado de la interpolación
  for i = 1:numel(X)
    L = 1; % Inicializa el polinomio base de Lagrange para el i-ésimo punto
    for j = 1:numel(X)
      if j ~= i
        L = L * ((x - X(j)) / (X(i) - X(j))); % Calcula el producto para el polinomio base
      endif
    endfor
    y = y + L * Y(i); % Suma el término correspondiente al resultado
  endfor
end
