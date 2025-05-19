% mincuadlin.m
% Calcula los coeficientes de la recta de mínimos cuadrados (y = m*x + b) para los datos dados.
% Entradas:
%   X : vector de valores de x conocidos
%   Y : vector de valores de y correspondientes a X
% Salidas:
%   m : pendiente de la recta ajustada
%   b : intercepto de la recta ajustada

function [m,b] = mincuadlin(X, Y)
  n = numel(X); % Número de puntos

  A = zeros(2,2); % Matriz del sistema normal
  B = zeros(2,1); % Vector del sistema normal

  % Construcción del sistema normal para mínimos cuadrados
  for i = 1:n
    A(1,1) = A(1,1) + X(i)^2;      % Suma de x^2
    A(1,2) = A(1,2) + X(i);        % Suma de x
    A(2,1) = A(2,1) + X(i);        % Suma de x
    B(1,1) = B(1,1) + X(i)*Y(i);   % Suma de x*y
    B(2,1) = B(2,1) + Y(i);        % Suma de y
  endfor

  A(2,2) = n; % Número de puntos en la posición (2,2) de la matriz

  sol = A \ B; % Resolución del sistema lineal

  m = sol(1,1); % Pendiente
  b = sol(2,1); % Intercepto
end