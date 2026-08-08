const quotes =[{
  text:"A qualidade mais importante para um investidor é o temperamento, e não o intelecto.",
  owner:"Warren Buffet,"
},{
  text:"Em muitos aspectos, o mercado de ações é como o clima: se você não gosta das condições atuais, tudo o que precisa fazer é esperar.",
 owner:"Low Simpson"
},{
  text:"Para ser um empresário e investidor de sucesso, você precisa ser emocionalmente neutro em relação a ganhar e perder.  Tudo faz parte do jogo.",
  owner:"Robert Kiyosaki"
},{
  text:"Se você não encontrar uma maneira de ganhar dinheiro enquanto dorme, você trabalhará até morrer.",
  owner:"Warren Buffet"
},
{
  text:"Quantos milionários você conhece que ficaram ricos investindo em contas poupança?  Eu encerro meu caso.",
  owner:"Robert G. Allen"
},{
  text:"A maneira mais fácil de administrar seu dinheiro é dar um passo de cada vez e não se preocupar em ser perfeito.",
  owner:"Ramit Sethi"
},{
  text:"Risco vem de você não saber o que está fazendo.",
  owner:"Warren Buffet"
},{
  text:"Uma jornada de mil quilômetros precisa começar com um simples passo.",
  owner:"Lao Tzu"
}];

module.exports.quote = ()=>{return quotes[Math.floor(Math.random()* quotes.length)]}