% IntLineal.m
% Realiza interpolación lineal para un valor dado x, usando los vectores de puntos X e Y.
% Entradas:
%   x : valor en el que se desea interpolar
%   X : vector de valores de x conocidos (debe estar ordenado)
%   Y : vector de valores de y correspondientes a X
% Salida:
%   y : valor interpolado en x

function y = IntLineal(x, X, Y)
  % Recorre los intervalos definidos por X para encontrar dónde cae x
  for i = 1:numel(X)-1
    if x >= X(i) && x <= X(i+1)
      % Aplica la fórmula de interpolación lineal entre los puntos (X(i), Y(i)) y (X(i+1), Y(i+1))
      y = (Y(i+1)-Y(i))/(X(i+1)-X(i))*(x-X(i)) + Y(i);
    endif
  endfor
end