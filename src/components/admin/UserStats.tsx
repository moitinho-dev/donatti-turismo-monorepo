"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface UserStat {
  id: string
  name: string
  email: string
  role: string
  totalPromos: number
  lastPromoDate?: string
  lastLoginDate?: string
}

interface UserStatsProps {
  userStats: UserStat[]
}

export function UserStats({ userStats }: UserStatsProps) {
  // Sort by total promos (descending)
  const sortedStats = [...userStats].sort((a, b) => b.totalPromos - a.totalPromos)

  // Colors for the bars
  const colors = ["#1D3153", "#337D9D", "#FEB100", "#FED400"]

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Agente
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Função
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total de Promoções
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Última Promoção
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Último Login
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStats.map((stat) => (
              <tr key={stat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                  <div className="text-xs text-gray-500">{stat.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      stat.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {stat.role === "admin" ? "Administrador" : "Agente"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.totalPromos}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stat.lastPromoDate
                    ? format(parseISO(stat.lastPromoDate), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "Nenhuma promoção"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stat.lastLoginDate
                    ? format(parseISO(stat.lastLoginDate), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "Nunca"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-primary-blue mb-4 font-mon">Desempenho por Agente</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedStats}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [value, "Total de Promoções"]}
                labelFormatter={(label) => `Agente: ${label}`}
              />
              <Bar dataKey="totalPromos" name="Total de Promoções">
                {sortedStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
