function somarNumeros(numeros) {
  let soma = 0;

for (let i = 0; i  < numeros.length; i++){
    soma= soma + numeros[i];

}

return soma;

}

console.log(somarNumeros([1, 2, 3, 4, 5])); // deve mostrar 15