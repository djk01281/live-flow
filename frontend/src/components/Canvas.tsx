import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  ConnectionMode,
  type Connection,
  type Edge,
  type Node,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Cursor from "./Cursor";

interface NodeData {
  label: string;
}

interface AwarenessState {
  cursor: { x: number; y: number } | null;
  color: string;
  clientId: number;
}

const generateRandomColor = () =>
  "#" + Math.floor(Math.random() * 16777215).toString(16);

const initialNodes: Node<NodeData>[] = [
  {
    id: "1",
    type: "input",
    data: { label: "노드 1" },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    data: { label: "노드 2" },
    position: { x: 100, y: 125 },
  },
  {
    id: "3",
    type: "output",
    data: { label: "노드 3" },
    position: { x: 250, y: 250 },
  },
];

export default function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [cursors, setCursors] = useState<Map<number, AwarenessState>>(
    new Map()
  );

  const ydoc = useRef<Y.Doc>();
  const provider = useRef<WebsocketProvider>();
  const flowRef = useRef<HTMLDivElement>(null);
  const userColor = useRef(generateRandomColor());

  useEffect(() => {
    const doc = new Y.Doc();
    const wsProvider = new WebsocketProvider(
      "ws://localhost:1234",
      "flow-room",
      doc
    );
    const nodesMap = doc.getMap("nodes");
    const edgesMap = doc.getMap("edges");

    ydoc.current = doc;
    provider.current = wsProvider;

    wsProvider.awareness.setLocalState({
      cursor: null,
      color: userColor.current,
      clientId: wsProvider.awareness.clientID,
    });

    wsProvider.awareness.on("change", () => {
      const states = new Map(
        wsProvider.awareness.getStates() as Map<number, AwarenessState>
      );
      setCursors(states);
    });

    if (nodesMap.size === 0) {
      initialNodes.forEach((node) => {
        nodesMap.set(node.id, JSON.parse(JSON.stringify(node)));
      });
    }

    nodesMap.observe(() => {
      const yNodes = Array.from(nodesMap.values()) as Node<NodeData>[];
      const validNodes = yNodes.map((node) => ({
        id: node.id,
        type: node.type || "default",
        data: node.data,
        position: {
          x: node.position.x,
          y: node.position.y,
        },
      }));
      setNodes(validNodes);
    });

    edgesMap.observe(() => {
      const yEdges = Array.from(edgesMap.values()) as Edge[];
      setEdges(yEdges);
    });

    const initialYNodes = Array.from(nodesMap.values()) as Node<NodeData>[];
    const validNodes = initialYNodes.map((node) => ({
      id: node.id,
      type: node.type || "default",
      data: node.data,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
    }));
    setNodes(validNodes);
    setEdges(Array.from(edgesMap.values()) as Edge[]);

    return () => {
      wsProvider.destroy();
      doc.destroy();
    };
  }, []);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      if (!ydoc.current) return;

      changes.forEach((change) => {
        if (change.type === "position") {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            const updatedNode = {
              ...node,
              position: change.position || node.position,
            };
            ydoc.current
              ?.getMap("nodes")
              .set(change.id, JSON.parse(JSON.stringify(updatedNode)));
          }
        }
      });
    },
    [nodes, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      if (!ydoc.current) return;

      changes.forEach((change) => {
        if (change.type === "remove") {
          ydoc.current?.getMap("edges").delete(change.id);
        }
      });
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge: Edge = {
        id: `e${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };

      if (ydoc.current) {
        ydoc.current.getMap("edges").set(newEdge.id, newEdge);
      }

      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!provider.current?.awareness || !flowRef.current) return;

    const bounds = flowRef.current.getBoundingClientRect();
    const cursor = {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };

    provider.current.awareness.setLocalState({
      cursor,
      color: userColor.current,
      clientId: provider.current.awareness.clientID,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!provider.current?.awareness) return;

    provider.current.awareness.setLocalState({
      cursor: null,
      color: userColor.current,
      clientId: provider.current.awareness.clientID,
    });
  }, []);

  return (
    <div
      ref={flowRef}
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeDrag={handleMouseMove}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {Array.from(cursors.entries()).map(([clientId, state]) => {
        if (
          !state.cursor ||
          clientId === provider.current?.awareness?.clientID
        ) {
          return null;
        }
        return (
          <Cursor
            key={clientId}
            x={state.cursor.x}
            y={state.cursor.y}
            color={state.color}
          />
        );
      })}
    </div>
  );
}
