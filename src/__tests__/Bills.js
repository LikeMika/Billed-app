
/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills  from "../containers/Bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import userEvent from "@testing-library/user-event"

jest.mock("../app/store", () => ({
  __esModule: true,
  default: {
    bills: () => ({
      list: () => Promise.resolve([
        {
          id: "1",
          date: "2024-04-01",
          status: "pending",
          type: "Hôtel",
          name: "Facture avril",
          amount: 100,
          fileUrl: "https://example.com/facture.jpg"
        }
      ])
    })
  }
}))

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.store = {
        bills: () => ({
          list: () => Promise.resolve([
            {
              id: "1",
              date: "2024-04-01",
              status: "pending",
              type: "Hôtel",
              name: "Facture avril",
              amount: 100,
              fileUrl: "https://example.com/facture.jpg"
            }
          ])
        })
      }
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.className).toEqual('active-icon')
    })

    test("Then action button to add a Bill should be visible", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const addBillButton = screen.getByTestId('btn-new-bill')
      expect(addBillButton.tagName).toBe("BUTTON")
    })

    test("Then bills should be ordered from earliest to latest", () => {
          document.body.innerHTML = BillsUI({ data: bills })
          const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
          const antiChrono = (a, b) => ((a < b) ? 1 : -1)
          const datesSorted = [...dates].sort(antiChrono)
          expect(dates).toEqual(datesSorted)
       })
    
    test("Then clicking on new bill button should navigate to NewBill page", () => {
      const onNavigate = jest.fn()
      const billsPage = new Bills({ document, onNavigate, store: window.store, localStorage: window.localStorage })
      document.body.innerHTML = BillsUI({ data: [] })
      const button = screen.getByTestId("btn-new-bill")
      button.addEventListener("click", billsPage.handleClickNewBill)
      userEvent.click(button)
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })

    test("Then clicking on eye icon should open the modal with image", () => {
      const onNavigate = jest.fn()
      document.body.innerHTML = BillsUI({ data: [{
        id: "1", date: "2024-04-01", status: "pending", type: "Hôtel", name: "Facture avril", amount: 100, fileUrl: "https://example.com/facture.jpg"
      }]})
      const billsContainer = new Bills({ document, onNavigate, store: window.store, localStorage: window.localStorage })
      $.fn.modal = jest.fn()
      const eyeIcon = screen.getAllByTestId("icon-eye")[0]
      userEvent.click(eyeIcon)
      expect($.fn.modal).toHaveBeenCalledWith('show')
      expect(document.querySelector(".modal-body").innerHTML).toContain("img")
    })
  })
})

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
    })

    test("fetches bills from mock API GET", async () => {
      window.store = {
        bills: () => ({
          list: () => Promise.resolve([
            {
              id: "1",
              date: "2024-04-01",
              status: "pending",
              type: "Hôtel",
              name: "Facture avril",
              amount: 100,
              fileUrl: "https://example.com/facture.jpg"
            }
          ])
        })
      }
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      expect(screen.getByTestId("tbody").children.length).toBeGreaterThan(0)
    })
  })
})
