import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactFlow, { Controls, Background, MiniMap, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

const Diagram = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [funnelName, setFunnelName] = useState('');
  const searchParams = useSearchParams();
  const funilNome = searchParams.get('funil_nome') || 'TesteLive';

  useEffect(() => {
    async function fetchFunnelData() {
      try {
        const response = await fetch(`https://app.leadsfunnel.com.br/version-test/api/1.1/wf/listar_funil?funil_nome=${funilNome}`);
        const data = await response.json();

        if (!data.response || !data.response.etapas) {
          console.error("Erro: Estrutura de dados inválida", data);
          return;
        }

        setFunnelName(funilNome);

        // Ordenando as etapas pelo campo 'ordem'
        const etapasOrdenadas = data.response.etapas.sort((a, b) => a.ordem - b.ordem);

        const newNodes = etapasOrdenadas.map((etapa, index) => {
          const elementosDaEtapa = etapa.elementos
            .map((elementoId) => {
              // Buscando o elemento correto na lista de elementos
              const elemento = data.response.elementos.find((e) => e._id === elementoId);
              return elemento ? elemento.tipo_elemento : 'Tipo Desconhecido'; // Garantindo que o tipo seja obtido
            })
            .join(', '); // Unindo os tipos dos elementos em uma string

          return {
            id: etapa._id,
            data: { 
              label: `${etapa.nome} - Tipos: ${elementosDaEtapa}` 
            },
            position: { x: index * 250, y: 100 }, // Alterado para distribuir na horizontal
          };
        });

        const newEdges = etapasOrdenadas.slice(1).map((etapa, index) => ({
          id: `edge-${index}`,
          source: etapasOrdenadas[index]._id,
          target: etapa._id,
        }));

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    }

    fetchFunnelData();
  }, [funilNome]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  return (
    <div style={{ height: '100vh', padding: '20px' }}>
      <h1>{funnelName}</h1> {/* Exibir o nome do funil como título */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <MiniMap />
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default Diagram;
