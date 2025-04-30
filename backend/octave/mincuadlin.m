function [m,b] = mincuadlin(X, Y)
  n = numel(X);

  A = zeros(2,2);
  B = zeros(2,1);

  for i = 1:n
    A(1,1) += X(i)^2;
    A(1,2) += X(i);
    A(2,1) += X(i);
    B(1,1) += X(i) * Y(i);
    B(2,1) += Y(i);
  endfor

  A(2,2) = n;
  sol = A \ B;

  m = sol(1,1);
  b = sol(2,1);

  disp([m, b]);
end
