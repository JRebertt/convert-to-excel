  import fs from 'fs';
  import pump from 'pump';
  import Fastify from 'fastify';
  import fastifyMultipart from '@fastify/multipart';
  import fastifyCors from '@fastify/cors';
  import xlsx from 'xlsx';
  import progress from 'progress';

  const fastify = Fastify();

  fastify.register(fastifyCors);
  fastify.register(fastifyMultipart);
  fastify.post('/', async function (req, reply) {
    const data = await req.file();
    if (data) {
      if (
        data.mimetype === 'application/vnd.ms-excel' ||
        data.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        const storedFile = fs.createWriteStream(`./${data.filename}`);
        await pump(data.file, storedFile);

        // Leitura do arquivo Excel
        const workbook = xlsx.readFile(`./${data.filename}`);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Conversão para JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        // Mostrar progresso da conversão
        const progressBar = new progress('Conversão em andamento [:bar] :percent', {
          total: 1, // Número total de itens a serem processados
          width: 40, // Largura da barra de progresso
          complete: '=',
          incomplete: ' ',
        });

        progressBar.tick(); // Incrementar o progresso

        reply.send(jsonData);

        return { message: 'arquivo recebido', data: jsonData };
      } else {
        reply.code(400).send({ error: 'Tipo de arquivo inválido' });
      }
    } else {
      reply.code(400).send({ error: 'Nenhum arquivo enviado' });
    }
  });

  fastify.listen({
    port: 3001,
    host: '0.0.0.0',
  }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`API rodando em ${address}`);
  });
