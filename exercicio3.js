function encontrarMaior(numeros) {
    let maior = numeros[0];

    for (let i = 0; i < numeros.length; i++) {
        if (numeros[i] > maior) {
            maior = numeros[i];
        }
    }

    return maior;
}

 console.log(encontrarMaior([4, 8, 2, 15, 9]));  