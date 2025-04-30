function y = IntLineal(x, X, Y)
  for i = 1:numel(X)-1
    if x >= X(i) && x <= X(i+1)
      y = (Y(i+1)-Y(i))/(X(i+1)-X(i))*(x-X(i)) + Y(i);
    endif
  endfor
end
